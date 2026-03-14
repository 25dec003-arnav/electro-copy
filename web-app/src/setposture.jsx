import React, { useState, useEffect, useRef } from 'react';
import { NotificationManager } from './notifications/NotificationManager';

const INNER_EYE_LEFT = 133;
const INNER_EYE_RIGHT = 362;

function calculateDistance(p1, p2) {
    if (!p1 || !p2) return 0;
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Custom Hook: useProximity
 * Encapsulates all distance tracking and alert logic.
 */
export const useProximity = (onHazardTriggered) => {
    const [restingDistance, setRestingDistance] = useState(() => 
        Number(localStorage.getItem('optisync_resting_dist')) || 50
    );
    const [safeThreshold, setSafeThreshold] = useState(() => 
        Number(localStorage.getItem('optisync_safe_threshold')) || 35
    );
    const [currentDistance, setCurrentDistance] = useState(null);
    const [proximityStatus, setProximityStatus] = useState('SAFE');
    const [proximityTimeLeft, setProximityTimeLeft] = useState(30);

    const engineRef = useRef({
        startTime: null,
        alertTriggered: false
    });

    useEffect(() => {
        const handleLandmarks = (event) => {
            const landmarks = event.detail;
            if (!landmarks || landmarks.length === 0) {
                setCurrentDistance(null);
                return;
            }

            const now = Date.now();
            const pixelDist = calculateDistance(landmarks[INNER_EYE_LEFT], landmarks[INNER_EYE_RIGHT]);
            const estimatedCm = Math.round(5.5 / pixelDist);
            setCurrentDistance(estimatedCm);

            if (estimatedCm < safeThreshold) {
                if (!engineRef.current.startTime) engineRef.current.startTime = now;
                const elapsed = (now - engineRef.current.startTime) / 1000;
                const remaining = Math.max(0, 30 - elapsed);
                setProximityTimeLeft(Math.floor(remaining));
                setProximityStatus(remaining < 10 ? 'HAZARD' : 'WARNING');

                if (remaining <= 0 && !engineRef.current.alertTriggered) {
                    engineRef.current.alertTriggered = true;
                    NotificationManager.sendProximityAlert();
                    if (onHazardTriggered) onHazardTriggered(estimatedCm);
                }
            } else {
                engineRef.current.startTime = null;
                engineRef.current.alertTriggered = false;
                setProximityTimeLeft(30);
                setProximityStatus('SAFE');
            }
        };

        window.addEventListener('OPTISYNC_LANDMARKS', handleLandmarks);
        return () => window.removeEventListener('OPTISYNC_LANDMARKS', handleLandmarks);
    }, [safeThreshold, onHazardTriggered]);

    const calibrate = () => {
        if (currentDistance) {
            const newResting = currentDistance;
            const newSafe = Math.max(35, newResting - 10);
            setRestingDistance(newResting);
            setSafeThreshold(newSafe);
            localStorage.setItem('optisync_resting_dist', newResting);
            localStorage.setItem('optisync_safe_threshold', newSafe);
            alert(`✅ Posture Calibrated!\n\nResting: ${newResting}cm\nSafe Threshold: ${newSafe}cm`);
        }
    };

    return { 
        currentDistance, restingDistance, safeThreshold, 
        proximityStatus, proximityTimeLeft, calibrate 
    };
};

/**
 * UI Component: PostureCalibration
 */
export const PostureCalibration = ({ currentDistance, restingDistance, safeThreshold, onCalibrate }) => (
    <div className="calibration-section">
        <div className="calib-info">
            <p>Resting Posture: <strong>{restingDistance}cm</strong></p>
            <p>Safe Threshold: <strong style={{ color: '#ff4757' }}>{safeThreshold}cm</strong></p>
        </div>
        <button 
            className="btn-calibrate" 
            onClick={onCalibrate}
            style={{ cursor: currentDistance ? 'pointer' : 'not-allowed', opacity: currentDistance ? 1 : 0.6 }}
        >
            Set Resting Posture
        </button>
        <p className="calib-hint">Sit naturally and click to calibrate your safe distance.</p>
    </div>
);

/**
 * UI Component: ProximitySensor
 */
export const ProximitySensor = ({ currentDistance, safeThreshold, proximityStatus, proximityTimeLeft }) => (
    <div className={`diagnostic-block proximity-block ${proximityStatus.toLowerCase()}`}>
        <div className="diag-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
        </div>
        <div className="diag-content">
            <h4>Screen distance</h4>
            <div className="diag-value huge-text">
                {currentDistance || "--"} <span style={{ fontSize: '1rem' }}>cm</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '-8px' }}>
                Threshold: {safeThreshold}cm
            </div>
        </div>
        {proximityStatus !== 'SAFE' && (
            <div className="proximity-timer-badge">
                {proximityTimeLeft}s
            </div>
        )}
    </div>
);
