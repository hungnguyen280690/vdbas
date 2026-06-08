package com.fis.vdbas.qtdc.api.auth;

import com.fis.vdbas.qtdc.application.auth.servcie.ApplicationService;
import com.fis.vdbas.qtdc.application.auth.dto.ApplicationDto;
import com.fis.vdbas.qtdc.application.auth.dto.ApplicationSearchDto;
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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Controller for managing Applications.
 * <p>
 * Provides RESTful APIs (CRUD) to manage application information within the system.
 * </p>
 */
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@Tag(name = "Application Management", description = "APIs for managing registered applications")
public class ApplicationController {

    private final ApplicationService service;

    /**
     * Retrieves a list of all applications in the system.
     *
     * @return A list of {@link ApplicationDto}
     */
    @GetMapping
    @Operation(summary = "Get all applications", description = "Retrieves a complete list of all applications without pagination.")
    public List<ApplicationDto> all() {
        return service.findAll();
    }

    /**
     * Searches for applications with pagination based on filter criteria.
     *
     * @param body {@link ApplicationSearchDto} containing search and pagination information
     * @return {@link PageResponseDto} containing the list of applications and pagination details
     */
    @PostMapping("/search")
    @Operation(summary = "Search applications", description = "Searches for applications with pagination and filters.")
    public PageResponseDto<ApplicationDto> search(@RequestBody ApplicationSearchDto body) {
        return service.search(body);
    }

    /**
     * Retrieves detailed information of an application by ID.
     *
     * @param id The primary key of the application to retrieve
     * @return {@link ApplicationDto} containing application details
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get application by ID")
    public ApplicationDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * Creates a new application in the system.
     *
     * @param body Application data to be created
     * @return The application data after being saved to the database
     */
    @PostMapping
    @Operation(summary = "Create a new application")
    public ApplicationDto create(@Valid @RequestBody ApplicationDto body) {
        return service.create(body);
    }

    /**
     * Updates an existing application.
     *
     * @param id   The primary key of the application to update
     * @param body New data for the update
     * @return The application data after a successful update
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update an application")
    public ApplicationDto update(@PathVariable UUID id, @Valid @RequestBody ApplicationDto body) {
        return service.update(id, body);
    }

    /**
     * Updates the active status (Active/Inactive) of an application.
     *
     * @param id       The primary key of the application
     * @param isActive New status (true: active, false: disabled)
     * @return Application information after the status change
     */
    @PutMapping("/{id}/active")
    @Operation(summary = "Toggle application active status")
    public ApplicationDto updateActive(@PathVariable UUID id, @RequestBody Boolean isActive) {
        return service.updateActive(id, isActive);
    }

    /**
     * Performs a soft-delete on an application.
     *
     * @param id The primary key of the application to delete
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an application")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
