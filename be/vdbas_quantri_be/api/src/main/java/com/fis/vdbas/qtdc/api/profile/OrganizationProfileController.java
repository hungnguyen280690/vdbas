package com.fis.vdbas.qtdc.api.profile;

import com.fis.vdbas.qtdc.application.profile.servcie.OrganizationProfileService;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationProfileDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationProfileSearchDto;
import com.fis.vdbas.common.dto.PageResponseDto;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing Organization Profiles.
 * <p>
 * Provides APIs for searching, creating, updating, and deactivating organizations.
 * </p>
 */
@RestController
@RequestMapping("/api/organization-profiles")
@RequiredArgsConstructor
public class OrganizationProfileController {

    private final OrganizationProfileService service;

    /**
     * Searches for organizations based on criteria.
     *
     * @param body Search parameters
     * @return List of matching organization profiles
     */
    @PostMapping("/search")
    public List<OrganizationProfileDto> search(@Valid @RequestBody OrganizationProfileSearchDto body) {
        return service.search(body);
    }

    /**
     * Retrieves details of a specific organization profile.
     *
     * @param id Organization UUID
     * @return Organization details
     */
    @GetMapping("/{id}")
    public OrganizationProfileDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * Creates a new organization profile.
     *
     * @param body Organization data
     * @return The created profile
     */
    @PostMapping
    public OrganizationProfileDto create(@Valid @RequestBody OrganizationProfileDto body) {
        return service.create(body);
    }

    /**
     * Updates an existing organization profile.
     *
     * @param id   Organization UUID
     * @param body Updated data
     * @return The updated profile
     */
    @PutMapping("/{id}")
    public OrganizationProfileDto update(@PathVariable UUID id, @Valid @RequestBody OrganizationProfileDto body) {
        return service.update(id, body);
    }

    /**
     * Toggles the active status of an organization.
     *
     * @param id       Organization UUID
     * @param isActive New status
     * @return The updated profile
     */
    @PutMapping("/{id}/active")
    public OrganizationProfileDto updateActive(@PathVariable UUID id, @RequestBody Boolean isActive) {
        return service.updateActive(id, isActive);
    }

    /**
     * Soft-deletes an organization profile.
     *
     * @param id Organization UUID
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
