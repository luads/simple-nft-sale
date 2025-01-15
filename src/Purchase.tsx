import Typography from '@mui/material/Typography';
import { Alert, Button, Card, CardActions, CardContent, CardMedia, Stack } from '@mui/material';
import Container from '@mui/material/Container';
import { Modal } from '@mui/material';
import { Box } from '@mui/material';
import { config, passport } from '@imtbl/sdk';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { checkout } from '@imtbl/sdk';
import { useAsyncMemo } from './hooks';

const baseURL = "https://nft-purchase.replit.app";
const passportClientId = "xCoAxEybu7aFFqmCFoc4n1k4IuXtSOuK";

export function Purchase() {
  const [products, setProducts] = useState<{
    product_id: string;
    name: string;
    quantity: number;
    description: string;
    image: string;
    pricing: { amount: number; currency: string }[];
    collection: { collection_address: string; collection_type: string };
    status: string;
  }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'info' | 'warning' | 'error';
    message: ReactNode | string;
  } | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const environmentId = urlParams.get('environmentId') || '82a81049-8c41-4ae3-91ca-0bd82a283abc';
  const login = urlParams.get('login') as string;

  const isTestnet = !!Boolean(urlParams.get('testnet'));
  const environment = isTestnet
    ? config.Environment.SANDBOX
    : config.Environment.PRODUCTION;

  const baseConfig = new config.ImmutableConfiguration({
    environment,
  });

  const passportConfig = {
    baseConfig,
    clientId: passportClientId,
    redirectUri: `${baseURL}/?login=true&environmentId=${environmentId}`,
    logoutRedirectUri: `${baseURL}/?logout=true&environmentId=${environmentId}`,
    audience: 'platform_api',
    scope: 'openid offline_access email transact',
  };

  const passportInstance = useMemo(
    () => new passport.Passport(passportConfig),
    [],
  );

  const checkoutInstance = useMemo(() => {
    return new checkout.Checkout({
      baseConfig,
      passport: passportInstance,
    });
  }, [passportInstance]);

  const factory = useAsyncMemo(async () => {
    if (!checkoutInstance) return undefined;
    return checkoutInstance.widgets({ config: { theme: checkout.WidgetTheme.DARK, language: 'en' } });
  }, [checkoutInstance, passportInstance]);

  useEffect(() => {
    (async () => {
      const productsRequest = await fetch(`https://api${isTestnet ? '.sandbox' : ''}.immutable.com/v1/primary-sales/${environmentId}/products`);
      setProducts(await productsRequest.json());
    })();

  }, [environmentId]);

  const commerceWidget = useAsyncMemo(async () => {
    if (factory === undefined) return undefined;

    console.log('widget', await factory.create(checkout.WidgetType.IMMUTABLE_COMMERCE, {
      config: {},
    }))

    return factory.create(checkout.WidgetType.IMMUTABLE_COMMERCE, {
      config: {},
    });
  }, [factory]);

  useEffect(() => {
    if (!commerceWidget) {
      return;
    }

    commerceWidget.addListener(
      checkout.CommerceEventType.FAILURE,
      (data: checkout.CommerceFailureEvent) => {
        console.log('failure', data);

        setAlert({
          severity: 'error',
          message: (data.data as any)?.error?.reason || 'An error occurred',
        });
      },
    );
    commerceWidget.addListener(
      checkout.CommerceEventType.SUCCESS,
      (data: checkout.CommerceSuccessEvent) => {
        console.log('tx success', data);
      },
    );

    commerceWidget.addListener(checkout.CommerceEventType.CLOSE, () => {
      setModalOpen(false);
      commerceWidget.unmount();
    });
  }, [commerceWidget]);

  useEffect(() => {
    if (passportInstance && login) {
      passportInstance.loginCallback();
    }
  }, [login, passportInstance]);

  const handlePurchaseClick = (items: checkout.PurchaseItem[]) => {
    if (!commerceWidget) {
      return;
    }

    setModalOpen(true);

    setTimeout(() => {
      commerceWidget.mount('commerce-widget', {
        flow: checkout.CommerceFlowType.PURCHASE,
        environmentId,
        items,
      });
    }, 500);
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Sample direct NFT purchase
        </Typography>

        {alert && (
          <Alert severity={alert.severity} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}

        {products.length > 0 ? products.filter(p => p.status === 'active').map((product) => (
          <Card key={product.product_id} sx={{ mb: 2 }}>
            <CardMedia
              sx={{ height: 240 }}
              image={product.image}
              title={product.name}
            />
            <CardContent>
              <Stack direction="row" alignItems="center" alignContent="center" spacing={1} sx={{ mb: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {product.name}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {product.description}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {product.pricing[0].amount} {product.pricing[0].currency}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => {
                handlePurchaseClick([{
                  productId: product.product_id,
                  qty: 1,
                  name: product.name,
                  description: product.description,
                  image: product.image,
                }]);
              }}>
                Buy now
              </Button>
            </CardActions>
          </Card>
        )) : (
          <Typography variant="body1" component="p">
            Loading products...
          </Typography>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}>
            <div id="commerce-widget" style={{ color: 'rgb(243, 243, 243)' }} />
          </Box>
        </Modal>
      </Box>
    </Container>
  )
}
