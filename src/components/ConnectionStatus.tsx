import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import toast from "react-hot-toast";

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
      toast.success("Connection restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      toast.error("Connection lost");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test Firebase connection periodically
    const testFirebaseConnection = async () => {
      try {
        await getDocs(collection(db, "projects"));
        if (!firebaseConnected) {
          setFirebaseConnected(true);
          setShowStatus(true);
          setTimeout(() => setShowStatus(false), 3000);
          toast.success("Database connection restored");
        }
      } catch (error) {
        if (firebaseConnected) {
          setFirebaseConnected(false);
          setShowStatus(true);
          toast.error("Database connection lost");
        }
      }
    };

    // Initial test
    testFirebaseConnection();

    // Test every 30 seconds
    const interval = setInterval(testFirebaseConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [firebaseConnected]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await getDocs(collection(db, "projects"));
      setFirebaseConnected(true);
      toast.success("Connection restored");
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    } catch (error) {
      toast.error("Still unable to connect. Please try again later.");
    } finally {
      setIsRetrying(false);
    }
  };

  const connectionStatus = isOnline && firebaseConnected;

  return (
    <AnimatePresence>
      {(showStatus || !connectionStatus) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg ${
            connectionStatus
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {connectionStatus ? (
            <Wifi className="w-4 h-4" />
          ) : !isOnline ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          
          <span className="text-sm font-medium">
            {connectionStatus
              ? "Connected"
              : !isOnline
              ? "No internet connection"
              : "Database connection lost"
            }
          </span>

          {!connectionStatus && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-2 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors disabled:opacity-50"
              title="Retry connection"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            </button>
          )}

          {(showStatus && connectionStatus) && (
            <button
              onClick={() => setShowStatus(false)}
              className="ml-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;
