import { useEffect, useState } from 'react';
import './WarningPopup.css';

declare global {
  interface Window {
    TrelloPowerUp: any;
  }
}

const t = window.TrelloPowerUp ? window.TrelloPowerUp.iframe() : null;

export function WarningPopup() {
  const [limit, setLimit] = useState<number>(0);
  const [cardCount, setCardCount] = useState<number>(0);

  useEffect(() => {
    if (!t) return;
    
    t.render(() => {
      t.list('id', 'cards').then((list: any) => {
        setCardCount(list.cards.length);
        
        t.get('list', 'shared', 'limit').then((savedLimit: number) => {
          if (savedLimit) {
            setLimit(savedLimit);
          }
        });
      });
    });
  }, []);

  return (
    <div className="warning-popup-container">
      <div className="warning-title-section">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#F06A6A" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L1 21H23L12 2ZM12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18ZM11 15V10H13V15H11Z"/>
        </svg>
        <h1>LIST CAPACITY EXCEED!</h1>
      </div>

      <p className="warning-message">
        This list holds {cardCount} cards, which exceeds the limit threshold of {limit} cards!
      </p>

      <div className="actionable-box">
        <h2>ACTIONABLE SUGGESTIONS</h2>
        <ul>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#F06A6A" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z"/>
            </svg>
            <span>Click the + limit counter in the list header to increase space.</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#F06A6A" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z"/>
            </svg>
            <span>Move surplus cards in to adjacent columns on the boards</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
