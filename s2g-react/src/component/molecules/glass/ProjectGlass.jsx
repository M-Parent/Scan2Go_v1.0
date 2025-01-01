export function ProjectGlass({ children }) {
  return (
    <>
      <div className="flex justify-center">
        <div className="fixed bottom-[-15px] Glassmorphgisme-noHover rounded-xl sm:w-2/5 h-2/4 w-2/3 px-4 py-6">
          {children}
        </div>
      </div>
    </>
  );
}
