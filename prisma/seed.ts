import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const categories = [
  { slug: 'grunty', name: 'Грунты' },
  { slug: 'udobreniya', name: 'Удобрения' },
  { slug: 'ot-bolezney', name: 'От болезней растений' },
  { slug: 'ot-vrediteley', name: 'От вредителей растений' },
  { slug: 'ot-sornyakov', name: 'От сорняков' },
  { slug: 'ot-gryzunov', name: 'От грызунов, мух, тараканов и комаров' },
  { slug: 'septiki', name: 'Средство для септиков и выгребных ям' },
  { slug: 'kashpo', name: 'Кашпо, горшки и вазоны' },
  { slug: 'ukryvnye', name: 'Укрывные материалы' },
  { slug: 'semena', name: 'Семена' },
  { slug: 'kora', name: 'Кора лиственницы' },
  { slug: 'semena-morkovi', name: 'Семена моркови' },
  { slug: 'semena-tykvy', name: 'Семена тыквы' },
  { slug: 'semena-ogurcov', name: 'Семена огурцов' },
  { slug: 'semena-cvetov', name: 'Семена цветов' },
];

const products = [
  {
    slug: 'krutaya-morkovka-3000-1',
    name: 'Крутая морковка 3000(1 вар. стр.)',
    price: 100,
    categorySlug: 'semena-morkovi',
    image: '/products/carrot.png',
    description: 'Семена моркови для домашнего огорода и сезонной посадки.',
  },
  {
    slug: 'krutaya-morkovka-3000-2',
    name: 'Крутая морковка 3000(2 вар. стр.)',
    price: 100,
    categorySlug: 'semena-morkovi',
    image: '/products/carrot.png',
    description: 'Популярный сорт моркови с аккуратными ровными корнеплодами.',
  },
  {
    slug: 'krutaya-tykva-3000',
    name: 'Крутая тыква 3000',
    price: 100,
    categorySlug: 'semena-tykvy',
    image: '/products/pumpkin.png',
    description: 'Семена тыквы для выращивания крупных сладких плодов.',
  },
  {
    slug: 'ogurec-shiraz-f1',
    name: 'Семена Огурец "Шираз", F1, серия География, 10 шт',
    price: 100,
    categorySlug: 'semena-ogurcov',
    image: '/products/cucumber.png',
    description:
      'Скороспелый партенокарпический гибрид огурцов для теплиц и открытого грунта.\nПлоды цилиндрические, темно-зеленые, сочные и сладкие.\nПодходит для свежих салатов и сезонного выращивания.',
  },
  {
    slug: 'krutoy-ogurec-3000',
    name: 'Крутой огурец 3000',
    price: 100,
    categorySlug: 'semena-ogurcov',
    image: '/products/cucumber.png',
    description: 'Надежные семена огурцов для стабильного урожая.',
  },
];

async function main() {
  const categoryBySlug = new Map<string, number>();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });

    categoryBySlug.set(saved.slug, saved.id);
  }

  for (const product of products) {
    const categoryId = categoryBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category for ${product.categorySlug}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        price: product.price,
        categoryId,
        image: product.image,
        description: product.description,
      },
      create: {
        slug: product.slug,
        name: product.name,
        price: product.price,
        categoryId,
        image: product.image,
        description: product.description,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
