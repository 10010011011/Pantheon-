  // Rotation taking local axes to the given world basis (right, up, forward are orthonormal world vectors).
  function qFromBasis(out, r, u, f) {
    const m00 = r.x, m01 = u.x, m02 = f.x, m10 = r.y, m11 = u.y, m12 = f.y, m20 = r.z, m21 = u.z, m22 = f.z;
    const tr = m00 + m11 + m22;
    let x, y, z, w, s;
    if (tr > 0) { s = Math.sqrt(tr + 1) * 2; w = 0.25 * s; x = (m21 - m12) / s; y = (m02 - m20) / s; z = (m10 - m01) / s; }
    else if (m00 > m11 && m00 > m22) { s = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s; }
    else if (m11 > m22) { s = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s; }
    else { s = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s; }
    out.x = x; out.y = y; out.z = z; out.w = w;
    return qNormalize(out, out);
  }
  return { qIdentity, qFromAxisAngle, qMultiply, qNormalize, qConjugate, qRotateVector, qSlerp, qLengthSq, qFromBasis };