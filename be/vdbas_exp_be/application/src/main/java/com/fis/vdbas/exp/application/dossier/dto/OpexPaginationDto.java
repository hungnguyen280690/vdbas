package com.fis.vdbas.exp.application.dossier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Pagination envelope cho OPEX list response (0-based page, field names khớp contract FE). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpexPaginationDto {
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
