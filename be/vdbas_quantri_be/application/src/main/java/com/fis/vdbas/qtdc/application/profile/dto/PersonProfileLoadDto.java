package com.fis.vdbas.qtdc.application.profile.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonProfileLoadDto implements Serializable {
    @NotNull(message = "Organization ID is required")
    private UUID orgId;
}
