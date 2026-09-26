import {IcsCalendar, IcsEventOptions} from "./ics";

// Types

type Subject = "Maths" | "Physique" | "Anglais";

type Examiner =
    "M. Graye"
    | "Malet"
    | "Chahed"
    | "Olive"
    | "Guède"
    | "Brès"
    | "Brigaudeau"
    | "Petitjean"
    | "M. Correia"
    | "Boyer"
    | "Plazat"
    | "Adak"
    | "M. Simon"
    | "Teulié"
    | "Tanet"
    | "Mokrani";

type Weekday = 1 | 2 | 3 | 4 | 5;
type Hour = 11 | 12 | 13 | 16 | 17 | 18;
type Room = "226" | "425" | "61D" | "633" | "61F" | "114" | "413" | "214" | "63A" | "112" | "5E4" | "61E" | "315" | "313" | "113" | "428";

type Kholle = {
    kind: "kholle";
    matiere: Subject;
    kholleur: Examiner;
    jour: Weekday;
    heure: Hour;
    salle: Room;
};

type SwitchSymbol = "heart" | "diamond" | "club";

type Switch = {
    kind: "switch";
    symbol: SwitchSymbol;
};

type WeekSlot = Kholle | Switch;

type Vacation = {
    starts: Date;
    ends: Date;
};

// Données

const GROUP_COUNT = 14;
const NOMBRE_SEMAINES = 7;

function kholle(matiere: Subject, kholleur: Examiner, jour: Weekday, heure: Hour, salle: Room): Kholle {
    return {kind: "kholle", matiere, kholleur, jour, heure, salle};
}

function switchTo(symbol: SwitchSymbol): Switch {
    return {kind: "switch", symbol};
}

const kholloscope: WeekSlot[][] = [
    [switchTo("heart")],
    [kholle("Physique", "Malet", 5, 13, "425"), kholle("Maths", "M. Correia", 3, 16, "226")],
    [kholle("Anglais", "Chahed", 2, 11, "61D"), kholle("Maths", "Boyer", 5, 16, "226")],
    [kholle("Physique", "M. Graye", 4, 18, "633"), switchTo("diamond")],
    [kholle("Anglais", "Chahed", 4, 18, "61F"), kholle("Maths", "Plazat", 3, 16, "114")],
    [kholle("Physique", "Olive", 1, 18, "413"), kholle("Maths", "Adak", 3, 17, "214")],
    [kholle("Anglais", "Guède", 4, 18, "63A"), kholle("Maths", "M. Simon", 5, 12, "112")],
    [kholle("Physique", "Brès", 5, 13, "428")],
    [kholle("Maths", "M. Correia", 3, 13, "226"), kholle("Anglais", "Tanet", 3, 17, "5E4")],
    [kholle("Physique", "M. Graye", 1, 18, "633"), kholle("Maths", "Boyer", 5, 17, "226")],
    [kholle("Anglais", "Brigaudeau", 1, 18, "61E"), switchTo("club")],
    [kholle("Physique", "Petitjean", 5, 12, "315"), kholle("Maths", "Teulié", 2, 18, "313")],
    [kholle("Anglais", "Chahed", 2, 12, "61D"), kholle("Maths", "Mokrani", 4, 18, "113")],
    [kholle("Physique", "M. Graye", 2, 18, "425"), kholle("Maths", "M. Simon", 5, 13, "112")],
];

function kholleAt(week: number, slot: number): Kholle {
    const entry = kholloscope[week][slot];
    if (entry.kind !== "kholle") throw new Error(`kholloscope[${week}][${slot}] n'est pas une khôlle`);
    return entry;
}

const switchChoices: Record<"diamond" | "club", Kholle[]> = {
    diamond: [kholleAt(4, 1), kholleAt(5, 1), kholleAt(6, 1)],
    club: [kholleAt(11, 1), kholleAt(12, 1), kholleAt(13, 1)],
};

// Toussaint 2026, Noël 2026, Hiver 2027, Printemps 2027 — mois attendus par Date() 0-indexés
const vacances: Vacation[] = [
    {starts: new Date(2026, 9, 17), ends: new Date(2026, 10, 2)},
    {starts: new Date(2026, 11, 19), ends: new Date(2027, 0, 4)},
    {starts: new Date(2027, 1, 13), ends: new Date(2027, 2, 1)},
    {starts: new Date(2027, 3, 10), ends: new Date(2027, 3, 26)},
];

// Fonctions utilitaires de dates

function nomJour(jour: Weekday): string {
    return ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"][jour - 1];
}

function formaterKholle(k: Kholle, avecJour = false): string {
    const base = `Khôlle ${k.matiere} - ${k.kholleur} (${k.salle})`;
    return avecJour ? `${nomJour(k.jour)}, ${k.heure}h-${k.heure + 1}h - ${base}` : base;
}

function lundiDe(date: Date): Date {
    const jour = date.getDay();
    const lundi = new Date(date);
    lundi.setDate(lundi.getDate() + (jour === 0 ? -6 : 1 - jour));
    lundi.setHours(12, 0, 0, 0);
    return lundi;
}

function jourDepuisLundi(lundi: Date, offset: number): Date {
    const date = new Date(lundi);
    date.setDate(date.getDate() + offset);
    return date;
}

function estEnVacances(date: Date): boolean {
    return vacances.some(v => date >= v.starts && date <= v.ends);
}

function decalerSiVacances(date: Date): Date {
    const d = new Date(date);
    while (estEnVacances(d)) d.setDate(d.getDate() + 14);
    return d;
}

// Groupe 10 mesuré comme référence : indiceRotation(10, 0) = 0
function indiceRotation(groupe: number, occurrence: number): number {
    const n = 10 - groupe + occurrence;
    return ((n % 14) + 14) % 14;
}

// Lundi où le groupe 10 est à l'indice 0 du kholloscope (calé manuellement une fois, ne pas décaler à la main)
const LUNDI_ANCRE = lundiDe(new Date(2026, 8, 21));

function occurrenceDepuisAncre(lundiCible: Date): number {
    let lundi = new Date(LUNDI_ANCRE);
    let occurrence = 0;
    while (lundi.getTime() < lundiCible.getTime()) {
        lundi.setDate(lundi.getDate() + 7);
        lundi = decalerSiVacances(lundi);
        occurrence++;
    }
    return occurrence;
}

// Logique de génération

function creerEvenementCoeurSansCible(lundi: Date): IcsEventOptions {
    const debut = new Date(lundi);
    debut.setHours(8, 0, 0);
    const fin = new Date(lundi);
    fin.setHours(18, 0, 0);
    return {
        title: "Case du cœur - groupe 1",
        description: "on ne sait pas ce qu'il fallait faire ici",
        start: debut,
        end: fin,
    };
}

function creerEvenementChoix(lundi: Date, options: Kholle[]): IcsEventOptions {
    const debut = new Date(lundi);
    debut.setHours(8, 0, 0);
    const fin = new Date(lundi);
    fin.setHours(18, 0, 0);
    return {
        title: "KHOLLE A PLACER (voir desc)",
        description: ["Vous devez choisir entre les khôlles suivantes:", ...options.map(k => formaterKholle(k, true))].join("\n"),
        start: debut,
        end: fin,
    };
}

function creerEvenementKholle(lundi: Date, k: Kholle): IcsEventOptions {
    const debut = jourDepuisLundi(lundi, k.jour - 1);
    debut.setHours(k.heure, 0, 0);
    const fin = jourDepuisLundi(lundi, k.jour - 1);
    fin.setHours(k.heure + 1, 0, 0);
    return {
        title: formaterKholle(k),
        location: k.salle,
        start: debut,
        end: fin,
    };
}

function khollesDuGroupe(groupe: number, occurrence: number, lundi: Date): IcsEventOptions[] {
    const semaine = kholloscope[indiceRotation(groupe, occurrence)];
    const evenements: IcsEventOptions[] = [];

    for (const creneau of semaine) {
        if (creneau.kind === "kholle") {
            evenements.push(creerEvenementKholle(lundi, creneau));
            continue;
        }

        if (creneau.symbol === "heart") {
            const groupeCible = groupe % 2 === 0 ? GROUP_COUNT : 1;
            if (groupeCible === groupe) {
                if (groupe === GROUP_COUNT) return evenements;
                evenements.push(creerEvenementCoeurSansCible(lundi));
                continue;
            }
            return khollesDuGroupe(groupeCible, occurrence, lundi);
        }

        evenements.push(creerEvenementChoix(lundi, switchChoices[creneau.symbol]));
    }

    return evenements;
}

// Exécution

const lundiInitial = decalerSiVacances(lundiDe(new Date()));
const occurrenceInitiale = occurrenceDepuisAncre(lundiInitial);

for (let groupe = 1; groupe < GROUP_COUNT; groupe++) {
    const calendrier = new IcsCalendar(`-//MPI//${groupe}`);
    let lundi = new Date(lundiInitial);

    for (let semaine = 0; semaine < NOMBRE_SEMAINES; semaine++) {
        for (const evt of khollesDuGroupe(groupe, occurrenceInitiale + semaine, lundi)) {
            calendrier.addEvent(evt);
        }
        lundi.setDate(lundi.getDate() + 7);
        lundi = decalerSiVacances(lundi);
    }

    calendrier.saveToFile(`../ics/Kholles - ${groupe}.ics`);
}
