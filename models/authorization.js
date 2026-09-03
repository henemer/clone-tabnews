function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;
    if (resource.id === user.id) {
      authorized = true;
    }
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;
