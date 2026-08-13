package com.quickserve.tokenqueue.entity;

/**
 * Kept in the exact case used across the API/frontend (Waiting, Preparing, ...)
 * instead of the usual Java UPPER_CASE enum convention, so JSON payloads read
 * naturally without needing a custom serializer.
 */
public enum TokenStatus {
    Waiting,
    Preparing,
    Ready,
    Collected
}
