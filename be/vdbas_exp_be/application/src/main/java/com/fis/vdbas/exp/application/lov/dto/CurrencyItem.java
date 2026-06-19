package com.fis.vdbas.exp.application.lov.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOV item loại tiền (schema {@code CurrencyItem}) — GAP-08/11.
 * <p>Không persist trong DDL hiện tại — trả tĩnh VND/USD theo SRS (LOV.01).</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrencyItem {

    private String code;
    private String name;
}
