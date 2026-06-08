package com.fis.vdbas.qtdc.application.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuNodeDto {

    private String code;
    private String name;
    private String path;
    private String method;

    @Builder.Default
    private List<MenuNodeDto> children = new ArrayList<>();
}



