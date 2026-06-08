package com.fis.vdbas.exp.application.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeDto {
    private UUID id;
    private String name;
    private String code;
    private Integer level;
    @Builder.Default
    private List<CategoryTreeDto> children = new ArrayList<>();
}
