import { defineQuiz } from "../quiz/types.ts";

const sections = [
    { id: "mat", title: "Mat og drikke" },
    { id: "sport", title: "Sport" },
    { id: "natur", title: "Natur og geografi" },
    { id: "oppfinnelser", title: "Oppfinnelser og næringsliv" },
];

// Spørsmålenes id-er brukes som nøkler i statistikk-backenden, så de må ikke endres og må være
// unike på tvers av alle quizer.
export default defineQuiz({
    slug: "norge-sverige-2",
    title: "Norge-Sverige del 2",
    description: "Mat, sport, natur og oppfinnelser: trivia fra begge sider av grensen.",
    image: "/fjell.jpg",
    imageAlt: "Fjell i solnedgang",
    heroImage: "/fjell.jpg",
    sections,
    questions: [
        // Mat og drikke
        {
            type: "choice",
            id: "semla",
            section: "mat",
            question:
                "Hva heter den svenske kardemommebollen med mandelmasse og krem som spises på fettisdagen?",
            options: ["Semla", "Kanelbulle", "Lussekatt", "Prinsesstårta"],
            answer: "Semla",
        },
        {
            type: "choice",
            id: "lutefisk",
            section: "mat",
            question: "Hvilken fisk lages norsk lutefisk av?",
            options: ["Laks", "Tørrfisk", "Sild", "Makrell"],
            answer: "Tørrfisk",
        },
        {
            type: "choice",
            id: "julmust",
            section: "mat",
            question:
                "Hvilken svensk brus selges i julen i større mengder enn Coca-Cola i Sverige?",
            options: ["Pommac", "Julmust", "Fanta", "Lingonsaft"],
            answer: "Julmust",
        },
        {
            type: "multi",
            id: "sjokolademerker",
            section: "mat",
            question: "Hvilke av disse sjokolademerkene er norske?",
            description: "Flere svar er riktige.",
            options: ["Freia", "Marabou", "Nidar", "Cloetta"],
            answer: ["Freia", "Nidar"],
        },

        // Sport
        {
            type: "choice",
            id: "borg",
            section: "sport",
            question: "Hvilken svensk tennisspiller vant Wimbledon fem år på rad, 1976 til 1980?",
            options: ["Stefan Edberg", "Björn Borg", "Mats Wilander", "Magnus Norman"],
            answer: "Björn Borg",
        },
        {
            type: "number",
            id: "solskjaer",
            section: "sport",
            question:
                "Hvilket år scoret Ole Gunnar Solskjær vinnermålet for Manchester United i Champions League-finalen mot Bayern München?",
            label: "Årstall",
            answer: 1999,
            tolerance: 3,
            min: 1980,
            max: 2025,
        },
        {
            type: "choice",
            id: "zlatan",
            section: "sport",
            question: "Hvem scoret et berømt saksespark fra lang avstand mot England i 2012?",
            options: [
                "Henrik Larsson",
                "Zlatan Ibrahimović",
                "Freddie Ljungberg",
                "Alexander Isak",
            ],
            answer: "Zlatan Ibrahimović",
        },
        {
            type: "choice",
            id: "haaland",
            section: "sport",
            question: "Hvilken klubb kjøpte Erling Haaland fra Borussia Dortmund i 2022?",
            options: ["Real Madrid", "Liverpool", "Manchester City", "Chelsea"],
            answer: "Manchester City",
        },

        // Natur og geografi
        {
            type: "choice",
            id: "galdhopiggen",
            section: "natur",
            question: "Hva heter Norges høyeste fjell?",
            options: ["Snøhetta", "Galdhøpiggen", "Store Skagastølstind", "Rondeslottet"],
            answer: "Galdhøpiggen",
        },
        {
            type: "choice",
            id: "kebnekaise",
            section: "natur",
            question: "Hva heter Sveriges høyeste fjell?",
            options: ["Åreskutan", "Sarek", "Kebnekaise", "Kinnekulle"],
            answer: "Kebnekaise",
        },
        {
            type: "choice",
            id: "vanern",
            section: "natur",
            question: "Hva er Sveriges største innsjø?",
            options: ["Vättern", "Mälaren", "Hjälmaren", "Vänern"],
            answer: "Vänern",
        },
        {
            type: "multi",
            id: "nasjonalparker",
            section: "natur",
            question: "Hvilke av disse nasjonalparkene ligger i Sverige?",
            description: "Flere svar er riktige.",
            options: ["Sarek", "Jotunheimen", "Abisko", "Rondane", "Stora Sjöfallet"],
            answer: ["Sarek", "Abisko", "Stora Sjöfallet"],
        },
        {
            type: "number",
            id: "innbyggere-norge",
            section: "natur",
            question: "Omtrent hvor mange millioner innbyggere har Norge?",
            description: "Du får delpoeng hvis du er nær.",
            label: "Millioner innbyggere",
            answer: 5.5,
            tolerance: 1.5,
            min: 1,
            max: 20,
        },

        // Oppfinnelser og næringsliv
        {
            type: "number",
            id: "dynamitt",
            section: "oppfinnelser",
            question: "Hvilket år fikk svensken Alfred Nobel patent på dynamitt?",
            description: "Du får delpoeng hvis du er nær.",
            label: "Årstall",
            answer: 1867,
            tolerance: 5,
            min: 1800,
            max: 1900,
        },
        {
            type: "number",
            id: "ikea-grunnlagt",
            section: "oppfinnelser",
            question: "Hvilket år ble IKEA grunnlagt av Ingvar Kamprad?",
            description: "Du får delpoeng hvis du er nær.",
            label: "Årstall",
            answer: 1943,
            tolerance: 10,
            min: 1900,
            max: 2000,
        },
        {
            type: "choice",
            id: "ostehovel",
            section: "oppfinnelser",
            question: "Hvilken hverdagsting oppfant nordmannen Thor Bjørklund i 1925?",
            options: ["Spraybokser", "Ostehøvel", "Vaffeljern", "Termos"],
            answer: "Ostehøvel",
        },
        {
            type: "choice",
            id: "sikkerhetsbelte",
            section: "oppfinnelser",
            question:
                "Hvilket svensk selskap tok i 1959 i bruk trepunkts sikkerhetsbelte i bilene sine?",
            options: ["Saab", "Volvo", "Scania", "Ericsson"],
            answer: "Volvo",
        },
        {
            type: "choice",
            id: "nobel-fredspris",
            section: "oppfinnelser",
            question:
                "Alfred Nobel testamenterte penger til Nobelprisene. I hvilken by deles fredsprisen ut?",
            options: ["Stockholm", "Bergen", "Oslo", "Genève"],
            answer: "Oslo",
        },
    ],
});
