package com.fis.vdbas.common.exception;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String errorCode, String messageKey, String resourceName, String fieldName,
            Object fieldValue) {
        super(
                errorCode,
                messageKey,
                String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue),
                new Object[] { resourceName, fieldName, fieldValue });
    }

    public ResourceNotFoundException(String errorCode, String messageKey, String defaultMessage) {
        super(errorCode, messageKey, defaultMessage);
    }
}
