package com.fis.vdbas.common.exception;

public class AccessDeniedException extends BusinessException {

    public AccessDeniedException(String errorCode, String messageKey, String defaultMessage) {
        super(errorCode, messageKey, defaultMessage);
    }

    public AccessDeniedException(String defaultMessage) {
        super(null, null, defaultMessage);
    }
}
