package com.fis.vdbas.common.exception;

public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String errorCode, String messageKey, String resourceName, String fieldName,
            Object fieldValue) {
        super(
                errorCode,
                messageKey,
                String.format("%s with %s '%s' already exists", resourceName, fieldName, fieldValue),
                new Object[] { fieldValue });
    }

    public DuplicateResourceException(String errorCode, String messageKey, String defaultMessage) {
        super(errorCode, messageKey, defaultMessage);
    }
}
