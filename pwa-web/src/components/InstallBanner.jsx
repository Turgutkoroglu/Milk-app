import React, { useState } from 'react';
import { isIos, isRunningAsInstalledApp } from '../push.js';

export default function InstallBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isRunningAsInstalledApp() || !isIos()) return null;

  return (
    <div className="note-card" style={{ margin: '12px 20px 0' }}>
      <span>📲</span>
      <div style={{ flex: 1 }}>
        Bildirimlerin çalışması için: Safari'de altta bulunan <strong>Paylaş</strong> ikonuna dokun,
        sonra <strong>"Ana Ekrana Ekle"</strong>'yi seç.
        <button className="link" style={{ margin: '4px 0 0', textAlign: 'left', fontSize: 12 }} onClick={() => setDismissed(true)}>
          Kapat
        </button>
      </div>
    </div>
  );
}
