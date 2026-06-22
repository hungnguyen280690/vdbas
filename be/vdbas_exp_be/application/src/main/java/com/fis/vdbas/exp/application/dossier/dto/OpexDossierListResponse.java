package com.fis.vdbas.exp.application.dossier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response envelope cho GET /exp/opex/dossiers — khớp contract FE:
 * { items, pagination: { page, size, totalElements, totalPages }, statusCounts }.
 * KHÔNG dùng PageResponseDto chung (field 'content' + flat pagination không khớp contract OPEX).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpexDossierListResponse {

    private List<DossierSummaryDto> items;

    private OpexPaginationDto pagination;

    /** Đếm toàn bộ hồ sơ OPEX active phân theo trạng thái (statusCode → count). */
    private Map<String, Long> statusCounts;
}
