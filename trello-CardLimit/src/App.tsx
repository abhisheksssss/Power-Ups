import { useEffect, useState } from 'react';
import { ListSettings } from './ListSettings';
import { WarningPopup } from './WarningPopup';
import './App.css';

function App() {
  const [page, setPage] = useState<string>('default');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('page');
    if (p) setPage(p);
  }, []);

  if (page === 'warning-popup') {
    return <WarningPopup />;
  }

  if (page === 'list-settings') {
    return <ListSettings />;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>👋 Hello from Trello Card Limit Power-Up!</h2>
      <p>This page is running inside Trello.</p>
    </div>
  );
}

export default App;
