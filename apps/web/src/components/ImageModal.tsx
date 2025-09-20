import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useGlobalLoader } from "@/contexts/GlobalLoaderContext";
import { ModalImageData } from "@/types/documentation";

interface ImageModalProps {
  image: ModalImageData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal = ({ image, isOpen, onClose }: ImageModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hasError, setHasError] = useState(false);
  const { show, hide } = useGlobalLoader();

  // Manejar apertura y cierre del dialog nativo
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && image) {
      // Resetear estados cuando se abre una nueva imagen
      setHasError(false);

      // Bloquear scroll del body
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Mostrar loader global
      show({
        variant: "spinner",
        size: "md",
        message: `Cargando ${image.alt}...`,
        overlay: true, // Activar overlay para que sea visible por encima del modal
      });

      dialog.showModal();
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      hide(); // Ocultar loader
      dialog.close();
    }

    // Cleanup: restaurar scroll si el componente se desmonta
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen, image, show, hide]);

  // Handlers para carga de imagen
  const handleImageLoad = () => {
    hide(); // Ocultar loader cuando la imagen carga
  };

  const handleImageError = () => {
    setHasError(true);
    hide(); // Ocultar loader en caso de error
  };

  // Manejar evento de cierre nativo del dialog (Escape)
  const handleDialogClose = () => {
    onClose();
  };

  if (!image) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 w-screen h-screen bg-transparent p-0 m-0 z-50 modal-no-scroll"
      onClose={handleDialogClose}
    >
      {/* Overlay clickeable para cerrar */}
      <button
        className="absolute inset-0 glass-modal-overlay modal-no-scroll cursor-pointer border-0 outline-0 p-0 m-0 bg-transparent"
        onClick={onClose}
        aria-label="Cerrar modal haciendo click en el fondo"
        type="button"
      />

      {/* Container principal con viewport fijo y márgenes */}
      <div className="relative w-screen h-screen modal-image-container modal-no-scroll pointer-events-none">
        <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 box-border modal-no-scroll pointer-events-none">
          {/* Contenedor de imagen con márgenes responsivos */}
          {!hasError ? (
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority={true}
              quality={95}
              style={{
                maxWidth: "min(calc(100vw - 2rem), calc(100vw - 32px))", // Margen mínimo responsivo
                maxHeight: "min(calc(100vh - 6rem), calc(100vh - 96px))", // Espacio para instrucciones + márgenes
              }}
            />
          ) : (
            <div className="glass-modal-container p-6 sm:p-8 rounded-xl text-center max-w-md mx-auto pointer-events-auto">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-white mb-2">Error al cargar la imagen</h3>
              <p className="text-sm text-slate-400">No se pudo cargar {image.alt}</p>
            </div>
          )}
        </div>

        {/* Indicación de cierre fija en la parte inferior */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 glass-secondary text-white/90 text-xs sm:text-sm px-3 py-2 rounded-full whitespace-nowrap pointer-events-auto">
          Presiona{" "}
          <kbd className="bg-white/20 px-2 py-1 rounded text-white font-medium mx-1">Esc</kbd> o haz
          clic en el fondo para cerrar
        </div>
      </div>
    </dialog>
  );
};
