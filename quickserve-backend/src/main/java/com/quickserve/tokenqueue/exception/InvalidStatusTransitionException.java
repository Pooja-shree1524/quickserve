package com.quickserve.tokenqueue.exception;

public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(String from, String to) {
        super("Cannot move token from \"" + from + "\" to \"" + to + "\".");
    }
}
