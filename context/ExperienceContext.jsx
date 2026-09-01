"use client";

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";

const STORAGE_KEY = "crisbo-experience";
const TOTAL_CHAPTERS = 9;

const initialState = {
  // Navegación
  currentScreen: "home", // home, quote, portfolio, social, menu
  currentChapter: 0,
  isTransitioning: false,
  showChapterTransition: false,
  transitionData: null,

  // Datos del usuario
  name: "",
  contactMethod: "", // whatsapp, instagram, email
  contactValue: "",

  // Datos del proyecto
  intention: "", // recuerdo, transformacion, creencia, simbolo, algo-nuevo, no-se
  bodyZone: "",
  size: "",
  styles: [],
  description: "",
  references: [],

  // UI
  menuOpen: false,
  soundEnabled: false,
};

function experienceReducer(state, action) {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, currentScreen: action.payload, menuOpen: false };

    case "SET_CHAPTER":
      return { ...state, currentChapter: action.payload };

    case "NEXT_CHAPTER":
      return {
        ...state,
        currentChapter: Math.min(state.currentChapter + 1, TOTAL_CHAPTERS),
      };

    case "PREV_CHAPTER":
      return {
        ...state,
        currentChapter: Math.max(state.currentChapter - 1, 0),
      };

    case "START_TRANSITION":
      return {
        ...state,
        isTransitioning: true,
        showChapterTransition: true,
        transitionData: action.payload,
      };

    case "END_TRANSITION":
      return {
        ...state,
        isTransitioning: false,
        showChapterTransition: false,
        transitionData: null,
      };

    case "SET_NAME":
      return { ...state, name: action.payload };

    case "SET_CONTACT":
      return {
        ...state,
        contactMethod: action.payload.method,
        contactValue: action.payload.value,
      };

    case "SET_INTENTION":
      return { ...state, intention: action.payload };

    case "SET_BODY_ZONE":
      return { ...state, bodyZone: action.payload };

    case "SET_SIZE":
      return { ...state, size: action.payload };

    case "TOGGLE_STYLE":
      const styles = state.styles.includes(action.payload)
        ? state.styles.filter((s) => s !== action.payload)
        : [...state.styles, action.payload];
      return { ...state, styles };

    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };

    case "ADD_REFERENCE":
      return { ...state, references: [...state.references, action.payload] };

    case "REMOVE_REFERENCE":
      return {
        ...state,
        references: state.references.filter((_, i) => i !== action.payload),
      };

    case "TOGGLE_MENU":
      return { ...state, menuOpen: !state.menuOpen };

    case "CLOSE_MENU":
      return { ...state, menuOpen: false };

    case "TOGGLE_SOUND":
      return { ...state, soundEnabled: !state.soundEnabled };

    case "RESET":
      return {
        ...initialState,
        soundEnabled: state.soundEnabled,
      };

    case "LOAD_STATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

const ExperienceContext = createContext(null);

export function ExperienceProvider({ children }) {
  const [state, dispatch] = useReducer(experienceReducer, initialState);

  // Cargar estado desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: "LOAD_STATE", payload: parsed });
      }
    } catch (e) {
      console.error("Error loading experience state:", e);
    }
  }, []);

  // Guardar estado en localStorage
  useEffect(() => {
    try {
      const toSave = {
        currentScreen: state.currentScreen,
        currentChapter: state.currentChapter,
        name: state.name,
        contactMethod: state.contactMethod,
        contactValue: state.contactValue,
        intention: state.intention,
        bodyZone: state.bodyZone,
        size: state.size,
        styles: state.styles,
        description: state.description,
        references: state.references,
        soundEnabled: state.soundEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Error saving experience state:", e);
    }
  }, [state]);

  // Navegación con transición
  const goToScreen = useCallback((screen) => {
    dispatch({ type: "SET_SCREEN", payload: screen });
  }, []);

  const goToChapter = useCallback((chapter, showTransition = true) => {
    if (showTransition) {
      dispatch({
        type: "START_TRANSITION",
        payload: { chapter },
      });

      setTimeout(() => {
        dispatch({ type: "SET_CHAPTER", payload: chapter });
        dispatch({ type: "END_TRANSITION" });
      }, 600);
    } else {
      dispatch({ type: "SET_CHAPTER", payload: chapter });
    }
  }, []);

  const nextChapter = useCallback(() => {
    const next = Math.min(state.currentChapter + 1, TOTAL_CHAPTERS);
    goToChapter(next);
  }, [state.currentChapter, goToChapter]);

  const prevChapter = useCallback(() => {
    const prev = Math.max(state.currentChapter - 1, 0);
    goToChapter(prev, false);
  }, [state.currentChapter, goToChapter]);

  // Generar mensaje de WhatsApp
  const generateWhatsAppMessage = useCallback(() => {
    const intentionMap = {
      recuerdo: "Un recuerdo",
      transformacion: "Una transformación",
      creencia: "Una creencia",
      simbolo: "Un símbolo",
      "algo-nuevo": "Algo nuevo",
      "no-se": "Aún no lo sé",
    };

    const lines = [
      `Hola Crisbo, soy ${state.name || "alguien interesado"}.`,
      "",
      "Acabo de completar la experiencia de tu web.",
      "",
      `*Idea:* ${intentionMap[state.intention] || "No especificada"}`,
      `*Zona:* ${state.bodyZone || "No especificada"}`,
      `*Tamaño:* ${state.size || "No especificado"}`,
      `*Estilo:* ${state.styles.join(", ") || "No especificado"}`,
      "",
      `*Mi concepto:*`,
      state.description || "Sin descripción adicional",
    ];

    return encodeURIComponent(lines.join("\n"));
  }, [state]);

  const openWhatsApp = useCallback(() => {
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/573202107769?text=${message}`, "_blank");
  }, [generateWhatsAppMessage]);

  const resetExperience = useCallback(() => {
    dispatch({ type: "RESET" });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    state,
    dispatch,
    goToScreen,
    goToChapter,
    nextChapter,
    prevChapter,
    openWhatsApp,
    resetExperience,
    totalChapters: TOTAL_CHAPTERS,
  };

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return context;
}
