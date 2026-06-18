package com.fis.vdbas.exp.application.dossier.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.List;

/**
 * Tiêu chí lọc danh sách hồ sơ (endpoint GET /exp/capex/dossiers).
 * Kế thừa {@code page/size/sortBy/sortDirection} từ {@link BaseSearchDto}.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class DossierSearchDto extends BaseSearchDto {

    /** Tìm nhanh theo người lập hoặc tên dự án (P1-12). */
    private String search;
    private String dossierCode;
    private String projectCode;

    /** SEND_DATE | CREATED_DATE | CHECKED_DATE | APPROVED_DATE. */
    private String dateField;
    private LocalDate fromDate;
    private LocalDate toDate;

    /** Multi-select trạng thái (P1-13). */
    private List<DossierStatus> fStatus;
    /** Multi-select nguồn gốc (P1-13). */
    private List<String> dataSourceCode;
    private String createdBy;
}
