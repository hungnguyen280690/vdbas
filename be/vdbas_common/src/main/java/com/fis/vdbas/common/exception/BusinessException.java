package com.fis.vdbas.common.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final String messageKey;
    private final Object[] messageArgs;

    public BusinessException(String errorCode, String messageKey, String defaultMessage) {
        super(defaultMessage);
        this.errorCode = errorCode;
        this.messageKey = messageKey;
        this.messageArgs = null;
    }

    public BusinessException(String errorCode, String messageKey, String defaultMessage, Object[] messageArgs) {
        super(defaultMessage);
        this.errorCode = errorCode;
        this.messageKey = messageKey;
        this.messageArgs = messageArgs;
    }

    public BusinessException(String errorCode, String messageKey, String defaultMessage, Throwable cause) {
        super(defaultMessage, cause);
        this.errorCode = errorCode;
        this.messageKey = messageKey;
        this.messageArgs = null;
    }

    public BusinessException(String errorCode, String messageKey, String defaultMessage, Object[] messageArgs,
            Throwable cause) {
        super(defaultMessage, cause);
        this.errorCode = errorCode;
        this.messageKey = messageKey;
        this.messageArgs = messageArgs;
    }
}
