package com.fis.vdbas.common.dto;

import lombok.Data;

@Data
public class BaseSearchDto {
    private int page = 0;
    private int size = 20;
    private String sortBy;
    private String sortDirection = "asc";
}
