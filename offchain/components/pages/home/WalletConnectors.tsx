import { paymentCredentialOf, stakeCredentialOf } from "@lucid-evolution/lucid";
import { Button } from "@heroui/button";
import { Skeleton } from "@heroui/skeleton";
import { Snippet } from "@heroui/snippet";
import { Spinner } from "@heroui/spinner";

import { useWallet } from "@/components/contexts/wallet/WalletContext";
import { Wallet } from "@/types/cardano";
import { handleError } from "@/components/utils";

export default function WalletConnectors() {
  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid } = walletConnection;

  function getWallets() {
    const wallets: Wallet[] = [];

    const { cardano } = window;

    for (const c in cardano) {
      const wallet = cardano[c];

      if (!wallet.apiVersion) continue; // skip non-wallet objects, if any
      wallets.push(wallet);
    }

    return wallets.sort((l, r) => {
      return l.name.toUpperCase() < r.name.toUpperCase() ? -1 : 1;
    });
  }

  const wallets = getWallets();

  async function onConnectWallet(wallet: Wallet) {
    try {
      if (!lucid) throw "Uninitialized Lucid!!!";

      const walletApi = await wallet.enable();

      lucid.selectWallet.fromAPI(walletApi);

      const address = await lucid.wallet().address();
      const pkh = paymentCredentialOf(address).hash;

      const stakeAddress = (await lucid.wallet().rewardAddress()) ?? "";
      const skh = stakeAddress ? stakeCredentialOf(stakeAddress).hash : "";

      setWalletConnection((walletConnection) => {
        return {
          ...walletConnection,
          wallet,
          walletApi,
          address,
          pkh,
          stakeAddress,
          skh,
        };
      });
    } catch (error) {
      handleError(error);
    }
  }

  if (!wallets)
    return (
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <Spinner label="Browsing Cardano Wallets" />
      </Snippet>
    );

  if (!wallets.length)
    return (
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <p className="uppercase">No Cardano Wallet</p>
      </Snippet>
    );

  return (
    <div className="flex flex-col gap-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6">
      {wallets.map((wallet, w) => (
        <Skeleton
          key={`wallet.${w}`}
          className="rounded-full"
          isLoaded={!!lucid}
        >
          <Button
            fullWidth
            className="capitalize"
            color="primary"
            radius="full"
            variant="shadow"
            onPress={() => onConnectWallet(wallet)}
          >
            {wallet.name}
          </Button>
        </Skeleton>
      ))}
    </div>
  );
}
