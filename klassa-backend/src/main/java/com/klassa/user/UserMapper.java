package com.klassa.user;

import com.klassa.user.dto.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface UserMapper {

    @Mapping(target = "fullName", expression = "java(user.fullName())")
    UserResponse toResponse(User user);
}
