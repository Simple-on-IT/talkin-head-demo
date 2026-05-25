import { Suspense, lazy } from 'react';

const AppShell = lazy(() =>
  import('./AppShell').then((module) => ({
    default: module.AppShell
  }))
);

export function App(): JSX.Element {
  return (
    <Suspense fallback={<main className="app-shell app-loading" aria-label="Загрузка" />}>
      <AppShell />
    </Suspense>
  );
}
