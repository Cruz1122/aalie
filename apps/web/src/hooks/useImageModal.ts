import { useState, useCallback, useEffect } from "react";

import { ModalImageData } from "@/types/documentation";

export const useImageModal = () => {
  const [selectedImage, setSelectedImage] = useState<ModalImageData | null>(null);

  const openModal = useCallback((imageData: ModalImageData) => {
    setSelectedImage(imageData);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedImage) {
        closeModal();
      }
    };

    if (selectedImage) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [selectedImage, closeModal]);

  return {
    selectedImage,
    openModal,
    closeModal,
    isModalOpen: selectedImage !== null,
  };
};
