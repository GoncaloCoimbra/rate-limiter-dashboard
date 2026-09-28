package com.company.ratelimiter.common;

public class InvalidDomainStateException extends RuntimeException {
    public InvalidDomainStateException(String message) {
        super(message);
    }
}
