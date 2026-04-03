import { submitVendorProfile } from "@/lib/vendor/submit-vendor-profile";
import type { VendorFormValues } from "@/lib/vendor/types";

function createValues(overrides: Partial<VendorFormValues> = {}): VendorFormValues {
  return {
    name: "Lahore Lights Catering",
    services: ["catering"],
    locationLabel: "Gulberg, Lahore",
    locationLat: 31.5204,
    locationLng: 74.3587,
    availability: { selectedDates: ["2026-06-10"] },
    portfolioUrl: [],
    primaryImageUrl: null,
    bio: "Reliable wedding catering team.",
    hourlyRate: 900,
    verified: false,
    claimedAt: null,
    ...overrides,
  };
}

describe("submitVendorProfile", () => {
  it("rejects an empty services array before submit", async () => {
    const from = vi.fn();

    await expect(
      submitVendorProfile(createValues({ services: [] }), {
        userId: "user-1",
        supabase: { from },
      })
    ).rejects.toThrow("Choose at least one service.");

    expect(from).not.toHaveBeenCalled();
  });

  it("uploads the image and writes the vendor profile payload", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    const uploadImage = vi.fn().mockResolvedValue("https://cdn.example.com/vendor.jpg");
    const file = new File(["demo"], "vendor.jpg", { type: "image/jpeg" });

    await submitVendorProfile(
      createValues(),
      {
        userId: "user-42",
        supabase: { from },
        uploadImage,
      },
      file
    );

    expect(uploadImage).toHaveBeenCalledWith(file, "user-42");
    expect(from).toHaveBeenCalledWith("vendors");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-42",
        name: "Lahore Lights Catering",
        services: ["catering"],
        hourly_rate: 900,
        primary_image_url: "https://cdn.example.com/vendor.jpg",
        portfolio_url: ["https://cdn.example.com/vendor.jpg"],
        location: "POINT(74.3587 31.5204)",
      })
    );
  });
});
