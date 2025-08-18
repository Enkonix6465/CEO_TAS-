import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { checkFirebaseConnection, isFirebaseConnected } from '../lib/firebase';

export default function FirebaseConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (!isFirebaseConnected()) {
        setIsConnected(false);
        return;
      }

      setIsChecking(true);
      try {
        const connected = await checkFirebaseConnection();
        setIsConnected(connected);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Check connection immediately
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  // Don't show anything if connection is good
  if (isConnected && !isChecking) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-200 ${
          isChecking
            ? 'bg-yellow-50/90 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-600'
            : isConnected
            ? 'bg-green-50/90 dark:bg-green-900/20 border-green-200 dark:border-green-600'
            : 'bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-600'
        }`}
      >
        {isChecking ? (
          <>
            <Wifi className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-pulse" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Checking connection...
            </span>
          </>
        ) : isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Connected
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Connection Lost
              </span>
              <span className="text-xs text-red-600 dark:text-red-400">
                Using offline mode
              </span>
            </div>
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </>
        )}
      </div>
    </div>
  );
}
