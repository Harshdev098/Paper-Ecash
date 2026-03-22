import loader from '@/assets/loader.gif'

type LoaderProps = {
  message: string | null;
};

export default function Loader({ message }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-black/20">
      <img src={loader} alt="loader" className="w-16 h-16" />
      {message && <p className="text-white text-center text-base font-semibold">{message}</p>}
    </div>
  );
}