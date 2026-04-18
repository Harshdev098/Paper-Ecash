import { createPortal } from "react-dom"
import loader from '@/assets/loader.gif'

type LoaderProps = {
  message: string | null;
};

export default function Loader({ message }: LoaderProps) {
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-3 bg-black/40">
      <img src={loader} alt="loader" className="w-16 h-16" />
      {message && (
        <p className="text-white text-center text-base font-semibold">
          {message}
        </p>
      )}
    </div>,
    document.body
  );
}