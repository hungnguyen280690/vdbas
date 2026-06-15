package com.fis.vdbas.exp.application.masterdata.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GuaranteeDto {
    private Long guaranteeId;
    private String guaranteeNo;
    private BigDecimal guaranteeAmount;
    private BigDecimal guaranteeRemainingAmount;
    private LocalDate guaranteeExpiryDate;
}
