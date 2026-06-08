package com.fis.vdbas.common.exception;

public class InvalidOperationException extends BusinessException {

    public InvalidOperationException(String errorCode, String messageKey, String defaultMessage) {
        super(errorCode, messageKey, defaultMessage);
    }

    public InvalidOperationException(String errorCode, String messageKey, String defaultMessage, Object[] messageArgs) {
        super(errorCode, messageKey, defaultMessage, messageArgs);
    }
}
