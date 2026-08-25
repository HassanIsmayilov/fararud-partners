import Sidebar from './Sidebar';

export default function Layout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {title && (
            <h1 className="text-2xl font-bold text-slate-800 mb-6">{title}</h1>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
