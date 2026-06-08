package com.fis.vdbas.common.exception;

public class DatabaseConstraintException extends BusinessException {

    public DatabaseConstraintException(String errorCode, String messageKey, String defaultMessage) {
        super(errorCode, messageKey, defaultMessage);
    }

    public DatabaseConstraintException(String errorCode, String messageKey, String defaultMessage, Throwable cause) {
        super(errorCode, messageKey, defaultMessage, cause);
    }
}
