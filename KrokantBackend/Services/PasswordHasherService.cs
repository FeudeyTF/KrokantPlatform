using System.Security.Cryptography;

namespace KrokantBackend.Services
{
    public class PasswordHasherService
    {
        private const string FormatMarker = "pbkdf2-sha256";
        private const int Iterations = 100_000;
        private const int SaltSize = 16;
        private const int KeySize = 32;

        public string HashPassword(string password)
        {
            ArgumentNullException.ThrowIfNull(password);

            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, KeySize);

            return $"{FormatMarker}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public bool VerifyPassword(string storedPassword, string providedPassword)
        {
            if (storedPassword is null || providedPassword is null)
                return false;

            if (!TryParseHash(storedPassword, out var iterations, out var salt, out var expectedHash))
                return false;

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(providedPassword, salt, iterations, HashAlgorithmName.SHA256, expectedHash.Length);
            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        public bool IsHashed(string password) =>
            password.StartsWith($"{FormatMarker}$", StringComparison.Ordinal);

        private static bool TryParseHash(string value, out int iterations, out byte[] salt, out byte[] hash)
        {
            iterations = 0;
            salt = [];
            hash = [];

            var parts = value.Split('$');
            if (parts.Length != 4 || !string.Equals(parts[0], FormatMarker, StringComparison.Ordinal))
                return false;

            if (!int.TryParse(parts[1], out iterations) || iterations <= 0)
                return false;

            try
            {
                salt = Convert.FromBase64String(parts[2]);
                hash = Convert.FromBase64String(parts[3]);
            }
            catch (FormatException)
            {
                return false;
            }

            return salt.Length > 0 && hash.Length > 0;
        }
    }
}
