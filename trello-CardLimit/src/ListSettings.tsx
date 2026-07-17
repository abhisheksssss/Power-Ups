import { useEffect, useState } from 'react';
import './ListSettings.css';

declare global {
  interface Window {
    TrelloPowerUp: any;
  }
}

const t = window.TrelloPowerUp ? window.TrelloPowerUp.iframe() : null;

export function ListSettings() {
  const [limit, setLimit] = useState<number>(0);
  const [listName, setListName] = useState<string>('Loading...');
  const [cardCount, setCardCount] = useState<number>(0);

  useEffect(() => {
    if (!t) return;
    
    t.render(() => {
      t.list('id', 'name', 'cards').then((list: any) => {
        setListName(list.name);
        setCardCount(list.cards.length);
        
        t.get(list.id, 'shared', 'limit').then((savedLimit: number) => {
          if (savedLimit) {
            setLimit(savedLimit);
          }
        });
      });
    });
  }, []);

  const handleSave = () => {
    if (!t) return;
    t.list('id').then((list: any) => {
      if (limit > 0) {
        t.set(list.id, 'shared', 'limit', limit).then(() => {
          t.closePopup();
        });
      } else {
        t.remove(list.id, 'shared', 'limit').then(() => {
          t.closePopup();
        });
      }
    });
  };

  const increase = () => setLimit((l: number) => l + 1);
  const decrease = () => setLimit((l: number) => Math.max(0, l - 1));

  const percentage = limit > 0 ? Math.min(100, (cardCount / limit) * 100) : 0;
  
  let statusColor = '#22c55e'; // green
  let statusText = 'Within limit';
  
  if (limit > 0) {
    if (percentage >= 100) {
      statusColor = '#ef4444'; // red
      statusText = 'Limit exceeded';
    } else if (percentage >= 70) {
      statusColor = '#eab308'; // yellow
      statusText = 'Nearing limit';
    }
  } else {
      statusColor = '#94a3b8'; // gray
      statusText = 'No limit set';
  }

  return (
    <div className="list-settings">
      <div className="header-info">
        <div className="icon-box" style={{ backgroundColor: statusColor + '22', color: statusColor }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><path d="M12 6V12L16 14"></path></svg>
        </div>
        <div className="list-details">
          <h3>{listName} <span className="status-dot" style={{ backgroundColor: statusColor }}></span> {limit > 0 ? `(${cardCount}/${limit})` : ''}</h3>
          <p className="status-text" style={{ color: statusColor }}>{statusText}</p>
        </div>
      </div>
      
      <div className="stats-section">
        <div className="stats-header">
          <span>Cards in list</span>
          <span style={{ color: statusColor, fontWeight: 600 }}>{cardCount} {limit > 0 ? `/ ${limit}` : ''}</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${percentage}%`, backgroundColor: statusColor }}></div>
        </div>
      </div>

      <div className="control-section">
        <label>Maximum cards</label>
        <div className="number-input">
          <button onClick={decrease}>-</button>
          <input type="number" value={limit} readOnly />
          <button onClick={increase}>+</button>
        </div>
        <p className="helper-text">
          The list header turns yellow past 70% limit, and red once it's exceeded. Set to 0 to remove limit.
        </p>
      </div>

      <button className="save-button" onClick={handleSave}>Save</button>
    </div>
  );
}
