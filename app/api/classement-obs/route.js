
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDRE_GRADES = {
  Civil: 0,
  Soldat: 1,
  Adgent: 2,
  "Adgent Lijo": 3,
  Colonel: 4,
  "Colonel en Chef": 5,
  "Vice Amiral": 6,
  Amiral: 7,
  "Général": 8,
  Sergent: 9,
  "Sergent Chef": 10,
  "Officier général": 11,
};

const nombre = (valeur) => {
  const resultat = Number(valeur ?? 0);
  return Number.isFinite(resultat) ? resultat : 0;
};

const scoreGrade = (joueur) =>
  joueur.officier_general === true
    ? 11
    : (ORDRE_GRADES[joueur.grade] ?? 0);

function headersPour(request) {
  const origin = request.headers.get("origin");

  return {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Origin",
    ...(origin === "null"
      ? { "Access-Control-Allow-Origin": "null" }
      : {}),
  };
}

function json(request, contenu, status = 200) {
  return Response.json(contenu, {
    status,
    headers: headersPour(request),
  });
}

export function OPTIONS(request) {
  if (request.headers.get("origin") !== "null") {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...headersPour(request),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization",
      "Access-Control-Max-Age": "600",
    },
  });
}

function jetonValide(request, attendu) {
  const auth =
    request.headers.get("authorization") ?? "";

  if (!auth.startsWith("Bearer ")) {
    return false;
  }

  const fourni = Buffer.from(
    auth.slice(7),
    "utf8"
  );

  const reference = Buffer.from(
    attendu,
    "utf8"
  );

  return (
    fourni.length === reference.length &&
    timingSafeEqual(fourni, reference)
  );
}

function calculerClassements(lignes) {
  const joueurs = lignes.map(
    (joueur, index) => ({
      ...joueur,
      index,
    })
  );

  const rangs = joueurs.map(() => ({}));
  const ordres = joueurs.map(() => ({}));

  const tris = {
    grades: (a, b) =>
      scoreGrade(b) - scoreGrade(a) ||
      nombre(b.lives_depuis_soldat) -
        nombre(a.lives_depuis_soldat),

    lives: (a, b) =>
      nombre(b.total_lives) -
      nombre(a.total_lives),

    obus: (a, b) =>
      nombre(b.obus) -
      nombre(a.obus),
  };

  const valeur = {
    grades: scoreGrade,
    lives: (joueur) =>
      nombre(joueur.total_lives),
    obus: (joueur) =>
      nombre(joueur.obus),
  };

  for (const categorie of [
    "grades",
    "lives",
    "obus",
  ]) {
    const tries = [...joueurs].sort(
      tris[categorie]
    );

    let precedent;
    let rangPrecedent = 0;

    tries.forEach((joueur, index) => {
      const score = valeur[categorie](joueur);

      const rang =
        index > 0 && score === precedent
          ? rangPrecedent
          : index + 1;

      rangs[joueur.index][categorie] = rang;
      ordres[joueur.index][categorie] =
        index + 1;

      precedent = score;
      rangPrecedent = rang;
    });
  }

  return joueurs.map((joueur) => ({
    pseudo: joueur.pseudo ?? "",

    grade:
      joueur.officier_general === true
        ? "Officier général"
        : (joueur.grade ?? ""),

    punitionNom: joueur.punition ?? "",

    livesTotal: nombre(
      joueur.total_lives
    ),

    livesDepuisSoldat: nombre(
      joueur.lives_depuis_soldat
    ),

    obus: nombre(joueur.obus),

    rangs: rangs[joueur.index],
    ordres: ordres[joueur.index],
  }));
}

export async function GET(request) {
  const token =
    process.env.OBS_CLASSEMENT_TOKEN;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secret =
    process.env.SUPABASE_SECRET_KEY;

  if (
    !token ||
    token.length < 32 ||
    !url ||
    !secret
  ) {
    return json(
      request,
      {
        ok: false,
        code: "CONFIGURATION_DEV_INCOMPLETE",
      },
      503
    );
  }

  if (!jetonValide(request, token)) {
    return json(
      request,
      {
        ok: false,
        code: "ACCES_REFUSE",
      },
      401
    );
  }

  try {
    const supabase = createClient(
      url,
      secret,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data, error } =
      await supabase.rpc(
        "lister_classement"
      );

    if (error) {
      throw error;
    }

    const lignes = Array.isArray(data)
      ? data
      : [];

    if (lignes.length > 5000) {
      return json(
        request,
        {
          ok: false,
          code: "TROP_DE_JOUEURS",
        },
        503
      );
    }

    return json(request, {
      joueurs: calculerClassements(lignes),
    });
  } catch (erreur) {
    console.error(
      "classement-obs : lecture DEV impossible",
      erreur
    );

    return json(
      request,
      {
        ok: false,
        code: "LECTURE_CLASSEMENT_IMPOSSIBLE",
      },
      502
    );
  }
}
