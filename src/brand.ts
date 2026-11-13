export const brands = [
    { value: "", label: "Fremtind" },
    { value: "sparebank1", label: "SpareBank 1" },
    { value: "dnb", label: "DNB" },
    { value: "eika", label: "Eika" },
] as const;

export const BRAND_KEY = "fremtind-games:brand";

// Kjøres i <head> før første tegning, slik at valgt tema ikke blinker.
export const applyStoredBrandScript = `try{var b=localStorage.getItem(${JSON.stringify(BRAND_KEY)});if(b)document.documentElement.setAttribute("data-brand",b)}catch(e){}`;

export const readBrand = (): string => {
    try {
        const stored = window.localStorage.getItem(BRAND_KEY) ?? "";
        return brands.some((brand) => brand.value === stored) ? stored : "";
    } catch {
        return "";
    }
};

export const setBrand = (value: string) => {
    if (value) {
        document.documentElement.setAttribute("data-brand", value);
    } else {
        document.documentElement.removeAttribute("data-brand");
    }
    try {
        if (value) {
            window.localStorage.setItem(BRAND_KEY, value);
        } else {
            window.localStorage.removeItem(BRAND_KEY);
        }
    } catch {
        // Lagring kan være blokkert. Valget gjelder da bare til siden lastes på nytt.
    }
};
