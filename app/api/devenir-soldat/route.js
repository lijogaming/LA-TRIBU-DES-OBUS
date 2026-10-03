import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function youtubeGet(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    const erreur = new Error(
      data?.error?.message ||
      "Erreur API YouTube"
    );

    erreur.status = response.status;

    throw erreur;
  }

  return data;
}

export async function POST(request) {
  try {
    // ============================================
    // 1. VÉRIFICATION DE LA SESSION DU SITE
    // ============================================

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return Response.json(
        {
          ok: false,
          code: "NON_CONNECTE",
          message:
            "Tu dois être connecté au site.",
        },
        { status: 401 }
      );
    }

    const supabaseAccessToken =
      authorization.substring(7);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(
      supabaseAccessToken
    );

    if (userError || !user) {
      return Response.json(
        {
          ok: false,
          code: "SESSION_INVALIDE",
          message:
            "Ta session a expiré. Reconnecte-toi.",
        },
        { status: 401 }
      );
    }

    // ============================================
    // 2. TOKEN YOUTUBE DU VIEWER
    // ============================================

    const body = await request.json();

    const youtubeAccessToken =
      body?.youtubeAccessToken;

    if (!youtubeAccessToken) {
      return Response.json(
        {
          ok: false,
          code: "YOUTUBE_NON_CONNECTE",
          message:
            "Reconnecte ton compte Google/YouTube.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. PROFIL JOUEUR
    // ============================================

    const {
      data: joueur,
      error: joueurError,
    } = await supabase
      .from("joueurs")
      .select(
        "id,pseudo,grade,youtube_channel_id,lives_depuis_soldat,obus"
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (joueurError) {
      throw joueurError;
    }

    if (!joueur) {
      return Response.json(
        {
          ok: false,
          code: "JOUEUR_INTROUVABLE",
          message:
            "Aucun profil joueur n'est lié à ce compte.",
        },
        { status: 404 }
      );
    }

    if (joueur.grade !== "Civil") {
      return Response.json({
        ok: true,
        code: "DEJA_SOLDAT",
        message:
          "Tu es déjà Soldat ou tu possèdes un grade supérieur.",
      });
    }

    // ============================================
    // 4. VÉRIFIER QUE LE COMPTE YOUTUBE
    //    CONNECTÉ EST BIEN CELUI DU JOUEUR
    // ============================================

    let chaines;

    try {
      chaines = await youtubeGet(
        "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
        youtubeAccessToken
      );
    } catch (erreur) {
      if (erreur.status === 401) {
        return Response.json(
          {
            ok: false,
            code: "YOUTUBE_EXPIRE",
            message:
              "L'autorisation YouTube a expiré. Reconnecte-toi avec Google.",
          },
          { status: 401 }
        );
      }

      throw erreur;
    }

    const chaineViewer =
      chaines.items?.find(
        (chaine) =>
          chaine.id ===
          joueur.youtube_channel_id
      );

    if (!chaineViewer) {
      return Response.json(
        {
          ok: false,
          code: "MAUVAIS_COMPTE_YOUTUBE",
          message:
            "Le compte YouTube connecté ne correspond pas au joueur du chat.",
        },
        { status: 403 }
      );
    }

    // ============================================
    // 5. TROUVER SA DERNIÈRE PRÉSENCE CIVIL
    // ============================================

    const {
      data: presence,
      error: presenceError,
    } = await supabase
      .from("presences")
      .select(
        "id,live_id,obus_gagnes,date_presence"
      )
      .eq("joueur_id", joueur.id)
      .eq("obus_gagnes", 0)
      .order("date_presence", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (presenceError) {
      throw presenceError;
    }

    if (!presence) {
      return Response.json(
        {
          ok: false,
          code: "PAS_DE_PRESENCE",
          message:
            "Écris d'abord au moins un message dans le chat du live.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 6. RÉCUPÉRER LE LIVE
    // ============================================

    const {
      data: live,
      error: liveError,
    } = await supabase
      .from("lives")
      .select(
        "id,youtube_live_id,titre"
      )
      .eq("id", presence.live_id)
      .single();

    if (liveError || !live) {
      throw new Error(
        "Live introuvable dans Supabase."
      );
    }

    // ============================================
    // 7. TROUVER LA CHAÎNE QUI HÉBERGE LE LIVE
    // ============================================

    const videoData =
      await youtubeGet(
        "https://www.googleapis.com/youtube/v3/videos" +
        "?part=snippet,liveStreamingDetails" +
        `&id=${encodeURIComponent(
          live.youtube_live_id
        )}`,
        youtubeAccessToken
      );

    const video =
      videoData.items?.[0];

    if (!video) {
      return Response.json(
        {
          ok: false,
          code: "LIVE_INTROUVABLE",
          message:
            "Le live YouTube est introuvable.",
        },
        { status: 404 }
      );
    }

    // On refuse un ancien live déjà terminé.
    if (
      video.liveStreamingDetails
        ?.actualEndTime
    ) {
      return Response.json(
        {
          ok: false,
          code: "LIVE_TERMINE",
          message:
            "Ce live est déjà terminé.",
        },
        { status: 400 }
      );
    }

    const chaineDuLive =
      video.snippet?.channelId;

    if (!chaineDuLive) {
      throw new Error(
        "Impossible d'identifier la chaîne du live."
      );
    }

    // ============================================
    // 8. VÉRIFIER L'ABONNEMENT
    // ============================================

    const abonnements =
      await youtubeGet(
        "https://www.googleapis.com/youtube/v3/subscriptions" +
        "?part=id" +
        "&mine=true" +
        `&forChannelId=${encodeURIComponent(
          chaineDuLive
        )}` +
        "&maxResults=1",
        youtubeAccessToken
      );

    const estAbonne =
      (abonnements.items || []).length > 0;

    // ============================================
    // 9. VÉRIFIER LE LIKE DU LIVE
    // ============================================

    const ratings =
      await youtubeGet(
        "https://www.googleapis.com/youtube/v3/videos/getRating" +
        `?id=${encodeURIComponent(
          live.youtube_live_id
        )}`,
        youtubeAccessToken
      );

    const rating =
      ratings.items?.[0]?.rating;

    const aLike =
      rating === "like";

    // ============================================
    // 10. CONDITIONS NON REMPLIES
    // ============================================

    if (!estAbonne && !aLike) {
      return Response.json({
        ok: false,
        code: "ABONNEMENT_ET_LIKE_MANQUANTS",
        estAbonne: false,
        aLike: false,
        message:
          "Tu dois t'abonner à la chaîne et liker le live.",
      });
    }

    if (!estAbonne) {
      return Response.json({
        ok: false,
        code: "ABONNEMENT_MANQUANT",
        estAbonne: false,
        aLike: true,
        message:
          "Le like est détecté ✅ mais tu dois aussi être abonné à la chaîne.",
      });
    }

    if (!aLike) {
      return Response.json({
        ok: false,
        code: "LIKE_MANQUANT",
        estAbonne: true,
        aLike: false,
        message:
          "L'abonnement est détecté ✅ mais tu dois aussi liker le live.",
      });
    }

    // ============================================
    // 11. PROMOTION SOLDAT
    // ============================================

    const {
      data: promotion,
      error: promotionError,
    } = await supabase.rpc(
      "promouvoir_civil_soldat",
      {
        p_joueur_id: joueur.id,
        p_live_id: live.id,
      }
    );

    if (promotionError) {
      throw promotionError;
    }

    return Response.json({
      ok: true,
      code: promotion,
      estAbonne: true,
      aLike: true,
      message:
        "Félicitations ! Tu deviens Soldat : +100 Obus et première présence validée.",
    });

  } catch (erreur) {
    console.error(
      "devenir-soldat :",
      erreur
    );

    return Response.json(
      {
        ok: false,
        code: "ERREUR_SERVEUR",
        message:
          erreur?.message ||
          "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}
