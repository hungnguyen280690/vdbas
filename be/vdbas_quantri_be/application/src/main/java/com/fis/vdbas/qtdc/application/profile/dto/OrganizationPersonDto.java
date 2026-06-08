package com.fis.vdbas.qtdc.application.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationPersonDto {

    private UUID id;
    private UUID personId;
    private UUID orgId;
    private String positionName;
    private Boolean main;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;

    // Optional: Include basic info from Person and Organization for display
    private String fullName;
    private String orgName;
    private String orgCode;
}
