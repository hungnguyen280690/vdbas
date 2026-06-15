package com.fis.vdbas.exp.domain.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.UUID;

@Converter
public class UuidToRawConverter implements AttributeConverter<UUID, byte[]> {

    @Override
    public byte[] convertToDatabaseColumn(UUID uuid) {
        if (uuid == null) return null;
        long msb = uuid.getMostSignificantBits();
        long lsb = uuid.getLeastSignificantBits();
        byte[] bytes = new byte[16];
        for (int i = 0; i < 8; i++) {
            bytes[i]   = (byte) (msb >>> (8 * (7 - i)));
            bytes[i+8] = (byte) (lsb >>> (8 * (7 - i)));
        }
        return bytes;
    }

    @Override
    public UUID convertToEntityAttribute(byte[] bytes) {
        if (bytes == null) return null;
        long msb = 0, lsb = 0;
        for (int i = 0; i < 8; i++) msb = (msb << 8) | (bytes[i] & 0xff);
        for (int i = 8; i < 16; i++) lsb = (lsb << 8) | (bytes[i] & 0xff);
        return new UUID(msb, lsb);
    }
}
