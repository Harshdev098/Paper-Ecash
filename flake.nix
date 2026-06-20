{
  description = "PaperEcash";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";

    fedimint = {
      url = "github:fedimint/fedimint/v0.10.0";
    };

    fedimint-wasm = {
      url = "github:fedimint/fedimint?rev=382afc209c80e5445c65ccfabd37edf282669291";
    };
  };

  outputs = { self, flake-utils, fedimint, fedimint-wasm }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        nixpkgs = fedimint.inputs.nixpkgs;

        pkgs = import nixpkgs {
          inherit system;

          overlays = [
            (import "${fedimint}/nix/overlays/esplora-electrs.nix")
          ];

          config.allowUnfree = true;
        };

        commonBuildInputs = [
          pkgs.nodejs_24
          pkgs.pnpm
          pkgs.git
          pkgs.gh
          pkgs.just
          pkgs.zip
          pkgs.coreutils
          pkgs.patch
        ];

        wasmBuildInputs = commonBuildInputs ++ [
          pkgs.bitcoind
          pkgs.electrs
          pkgs.esplora-electrs
          pkgs.lnd
          pkgs.netcat
          pkgs.jq
          pkgs.procps
          pkgs.which
          pkgs.go
          pkgs.libclang
          pkgs.playwright-driver.browsers
        ];

      in {
        devShells = {
          default = pkgs.mkShell {
            nativeBuildInputs = commonBuildInputs;

            shellHook = ''
              export LIBCLANG_PATH="${pkgs.libclang.lib}/lib"
            '';
          };

          wasm = pkgs.mkShell {
            nativeBuildInputs = wasmBuildInputs;

            shellHook = ''
              export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
              export LIBCLANG_PATH="${pkgs.libclang.lib}/lib"
            '';
          };

          wasm-tests = pkgs.mkShell {
            nativeBuildInputs =
              wasmBuildInputs ++ [
                fedimint.packages.${system}.devimint
                fedimint.packages.${system}.gateway-pkgs
                fedimint.packages.${system}.fedimint-pkgs
                fedimint.packages.${system}.fedimint-recurringd
                fedimint.packages.${system}.fedimint-recurringdv2
              ];

            shellHook = ''
              export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
              export LIBCLANG_PATH="${pkgs.libclang.lib}/lib"
            '';
          };
        };

        packages = {
          wasmBundle = fedimint-wasm.packages.${system}.wasmBundle;
        };
      }
    );

  nixConfig = {
    extra-substituters = [
      "https://fedimint.cachix.org"
      "https://fedibtc.cachix.org"
      "https://nix-community.cachix.org"
    ];

    extra-trusted-public-keys = [
      "fedimint.cachix.org-1:FpJJjy1iPVlvyv4OMiN5y9+/arFLPcnZhZVVCHCDYTs="
      "fedibtc.cachix.org-1:KyG8I1663EYQm2ThciPUvjm1r9PHiZbOYz4goj+U76k="
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };
}