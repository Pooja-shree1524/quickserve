package com.quickserve.tokenqueue.exception;

public class TokenNotFoundException extends RuntimeException {
    public TokenNotFoundException(String tokenNumber) {
        super("Token " + tokenNumber + " not found.");
    }
}
