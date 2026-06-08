import { useState } from 'react';
import styles from './ChatButton.module.css';

function ChatButton() {
  const [showNotification, setShowNotification] = useState(true);

  return (
    <div className={styles.chatBtnWrapper}>
      <button className={styles.chatBtn}>
        <span className={styles.chatIcon}>💬</span>
        Chat Bimbel
      </button>
      {showNotification && (
        <div className={styles.notificationBadge}>1</div>
      )}
    </div>
  );
}

export default ChatButton;
